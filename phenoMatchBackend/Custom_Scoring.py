from typing import List
from pyhpo import HPOTerm
from pyhpo.similarity.base import SimScore, SimilarityBase

class CustomJaccardIC(SimilarityBase):
    def __call__(
        self,
        term1: 'pyhpo.HPOTerm',
        term2: 'pyhpo.HPOTerm',
        kind: str,
        dependencies: List[float]
    ) -> float:

        if term1 == term2:
            return 1.0

        intersection_sum = sum(x.information_content[kind] for x in (term1.all_parents & term2.all_parents))
        union_sum = sum(x.information_content[kind] for x in (term1.all_parents | term2.all_parents))

        # since being a parent is mutually exclusive only one of these will be true if either
        if term1 in term2.all_parents:
            union_sum += term2.information_content[kind]
        elif term2 in term1.all_parents:
            union_sum += term1.information_content[kind]
        else:
            union_sum += (term1.information_content[kind] + term2.information_content[kind])

        try:
            return intersection_sum/union_sum
        except ZeroDivisionError:
            return 0.0
SimScore.register('custom_jaccardIC', CustomJaccardIC)

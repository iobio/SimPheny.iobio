from pyhpo.similarity.base import SimScore, SimilarityBase
from typing import List
import pyhpo

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
        
        term1_ic = term1.information_content[kind]
        term2_ic = term2.information_content[kind]

        common = sum([ x.information_content[kind] for x in term1.common_ancestors(term2) ])
        union = sum([ x.information_content[kind] for x in (term1.all_parents | term2.all_parents) ])

        if term1 in term2.all_parents and term2 in term1.all_parents:
            union_add = 0
        elif term1 in term2.all_parents:
            union_add = term2_ic
        elif term2 in term1.all_parents:
            union_add = term1_ic
        else:
            union_add = (term1_ic + term2_ic)

        union += union_add
        try:
            return common/union
        except ZeroDivisionError:
            return 0.0
SimScore.register('custom_jaccardIC', CustomJaccardIC)
